import AIAgent from './pages/AIAgent';
import Analytics from './pages/Analytics';
import Appointments from './pages/Appointments';
import Dashboard from './pages/Dashboard';
import DealerDashboard from './pages/DealerDashboard';
import DealerManagement from './pages/DealerManagement';
import DealerOnboarding from './pages/DealerOnboarding';
import LeadSearch from './pages/LeadSearch';
import MasterAdmin from './pages/MasterAdmin';
import Settings from './pages/Settings';
import Webhook from './pages/Webhook';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAgent": AIAgent,
    "Analytics": Analytics,
    "Appointments": Appointments,
    "Dashboard": Dashboard,
    "DealerDashboard": DealerDashboard,
    "DealerManagement": DealerManagement,
    "DealerOnboarding": DealerOnboarding,
    "LeadSearch": LeadSearch,
    "MasterAdmin": MasterAdmin,
    "Settings": Settings,
    "Webhook": Webhook,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};