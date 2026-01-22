import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Bulk CSV/Excel Importer with dry-run validation
 * Handles large files with async processing
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { file_url, field_mapping, dealer_id, dry_run = true } = body;

        // Fetch CSV file
        const response = await fetch(file_url);
        const csvText = await response.text();
        const rows = parseCSV(csvText);

        if (rows.length === 0) {
            return Response.json({ error: 'Empty file' }, { status: 400 });
        }

        const validationResults = {
            total_rows: rows.length,
            valid_rows: 0,
            invalid_rows: 0,
            errors: [],
            sample_data: []
        };

        const normalizedLeads = [];

        // Validate and normalize each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const errors = [];

            // Map fields
            const leadData = {
                name: row[field_mapping.name] || '',
                email: row[field_mapping.email] || '',
                phone: normalizePhone(row[field_mapping.phone] || ''),
                source: 'csv_import',
                vertical: 'dealer',
                status: 'new',
                priority: row[field_mapping.priority] || 'medium',
                vertical_data: {
                    vehicle_interest: {
                        year: row[field_mapping.vehicle_year],
                        make: row[field_mapping.vehicle_make],
                        model: row[field_mapping.vehicle_model],
                        vin: row[field_mapping.vehicle_vin]
                    },
                    import_source: 'bulk_csv',
                    import_date: new Date().toISOString(),
                    row_number: i + 1
                }
            };

            // Validation
            if (!leadData.name || leadData.name.length < 2) {
                errors.push('Invalid name');
            }
            if (!leadData.email || !leadData.email.includes('@')) {
                errors.push('Invalid email');
            }
            if (!leadData.phone || leadData.phone.length < 10) {
                errors.push('Invalid phone');
            }

            if (errors.length > 0) {
                validationResults.invalid_rows++;
                validationResults.errors.push({
                    row: i + 1,
                    errors,
                    data: row
                });
            } else {
                validationResults.valid_rows++;
                normalizedLeads.push(leadData);
                
                // Store sample for preview
                if (validationResults.sample_data.length < 5) {
                    validationResults.sample_data.push(leadData);
                }
            }
        }

        // Dry run - just return validation results
        if (dry_run) {
            return Response.json({
                dry_run: true,
                validation: validationResults,
                message: `Validation complete. ${validationResults.valid_rows} valid, ${validationResults.invalid_rows} invalid. Set dry_run=false to import.`
            });
        }

        // Actual import
        const importedLeads = [];
        const duplicates = [];

        for (const leadData of normalizedLeads) {
            // Check duplicates
            const duplicateCheck = await base44.asServiceRole.functions.invoke('deduplicateLead', {
                lead_data: leadData,
                dealer_id,
                window_hours: 72
            });

            if (duplicateCheck.data.is_duplicate) {
                duplicates.push({
                    lead_data: leadData,
                    original_lead_id: duplicateCheck.data.original_lead_id
                });
                continue;
            }

            // Create lead
            const lead = await base44.asServiceRole.entities.Lead.create(leadData);
            importedLeads.push(lead.id);

            // Trigger AI evaluation (async, don't wait)
            base44.asServiceRole.functions.invoke('eventTrigger', {
                event_type: 'new_lead',
                data: { lead_id: lead.id }
            });
        }

        // Update source stats
        const sources = await base44.asServiceRole.entities.LeadSource.filter({ 
            dealer_id, 
            source_type: 'csv_import' 
        });
        
        if (sources.length > 0) {
            await base44.asServiceRole.entities.LeadSource.update(sources[0].id, {
                stats: {
                    ...sources[0].stats,
                    total_leads: (sources[0].stats?.total_leads || 0) + importedLeads.length,
                    last_received: new Date().toISOString()
                }
            });
        }

        return Response.json({
            success: true,
            dry_run: false,
            imported: importedLeads.length,
            duplicates: duplicates.length,
            skipped: validationResults.invalid_rows,
            validation: validationResults
        });

    } catch (error) {
        console.error('Bulk import error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Handle headers - remove quotes
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        // Simple CSV parsing - handles quoted values
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
        });
        rows.push(row);
    }

    return rows;
}

function normalizePhone(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `+1${digits}`;
    } else if (digits.length === 11 && digits[0] === '1') {
        return `+${digits}`;
    }
    return phone;
}