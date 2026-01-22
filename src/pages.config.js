import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import AIAgent from './pages/AIAgent';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Webhook from './pages/Webhook';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Appointments": Appointments,
    "AIAgent": AIAgent,
    "Analytics": Analytics,
    "Settings": Settings,
    "Webhook": Webhook,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};