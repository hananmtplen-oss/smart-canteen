import { useCallback, useState } from 'react';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Presentation } from './components/Presentation';
import { AppProvider } from './lib/store';
import { LinkButton } from './components/ui';
import Home from './pages/student/Home';
import Menu from './pages/student/Menu';
import Cart from './pages/student/Cart';
import Slots from './pages/student/Slots';
import Checkout from './pages/student/Checkout';
import OrderDetail from './pages/student/OrderDetail';
import MyOrders from './pages/student/MyOrders';
import CrowdStatus from './pages/student/CrowdStatus';
import Analytics from './pages/student/Analytics';
import HowItWorks from './pages/student/HowItWorks';
import KitchenOverview from './pages/kitchen/KitchenOverview';
import KitchenQueue from './pages/kitchen/KitchenQueue';
import KitchenDemand from './pages/kitchen/KitchenDemand';
import KitchenSlots from './pages/kitchen/KitchenSlots';
import KitchenOccupancy from './pages/kitchen/KitchenOccupancy';
import Scanner from './pages/scanner/Scanner';
import DemoPanel from './pages/demo/DemoPanel';

/**
 * The pitch deck opens on a fresh visit to the site root, which is what judges
 * will hit when they open the shared link. Deep links (`#/kitchen`, `#/scanner`,
 * a reload mid-demo) skip it, so nobody gets bounced back to slide one while
 * presenting.
 */
function startOnDeck(): boolean {
  const path = window.location.hash.replace(/^#/, '');
  return path === '' || path === '/' || path === '/intro';
}

function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="font-display text-5xl font-extrabold text-slate-900">404</p>
      <p className="mt-2 text-sm text-slate-500">That counter does not exist in this canteen.</p>
      <div className="mt-6 flex justify-center">
        <LinkButton to="/">Back to Home</LinkButton>
      </div>
    </div>
  );
}

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [deckOpen, setDeckOpen] = useState(startOnDeck);

  const enterApp = useCallback(() => {
    setDeckOpen(false);
    navigate('/', { replace: true });
  }, [navigate]);

  // The deck renders outside AppShell so it reads as a full-screen presentation
  // rather than a page of the product.
  if (deckOpen || location.pathname === '/intro') {
    return <Presentation onEnter={enterApp} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/slots" element={<Slots />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:orderId" element={<OrderDetail />} />
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/crowd" element={<CrowdStatus />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/kitchen" element={<KitchenOverview />} />
        <Route path="/kitchen/queue" element={<KitchenQueue />} />
        <Route path="/kitchen/demand" element={<KitchenDemand />} />
        <Route path="/kitchen/slots" element={<KitchenSlots />} />
        <Route path="/kitchen/occupancy" element={<KitchenOccupancy />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/demo" element={<DemoPanel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppProvider>
  );
}
