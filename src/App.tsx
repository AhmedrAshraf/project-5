import React from 'react';
import { Clock, ShoppingCart, ArrowLeft, Phone, Home } from 'lucide-react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { getCurrentMenuCategory, isCurrentlyInTimeSlot } from './utils/time';
import { Landing } from './components/Landing';
import { Menu } from './components/Menu';
import { TenantProvider } from './contexts/TenantContext';
import { Cart } from './components/Cart';
import { OrderSuccess } from './components/OrderSuccess';
import { Footer } from './components/Footer';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminPanel } from './components/admin/AdminPanel';
import { AuthProvider } from './components/auth/AuthProvider';
import { SignIn } from './components/auth/SignIn';
import { SignUp } from './components/auth/SignUp';
import { useAuth } from './hooks/useAuth';
import type { MenuItem, OrderItem } from './types';

function App() {
  const navigate = useNavigate();
  const [view, setView] = React.useState<'welcome' | 'food' | 'drinks' | 'admin' | 'success' | 'cart' | 'signin' | 'signup'>('welcome');
  const { user, signIn, signOut } = useAuth();
  const [loginError, setLoginError] = React.useState<string>();
  const [cartItems, setCartItems] = React.useState<OrderItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const currentCategory = getCurrentMenuCategory();
  const [selectedCategory, setSelectedCategory] = React.useState<'breakfast' | 'lunch' | 'dinner'>(currentCategory || 'lunch');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeSlots, setTimeSlots] = React.useState<Array<{
    id: string;
    label: string;
    start_time: string;
    end_time: string;
    is_drinks: boolean;
  }>>([]);

  // Fetch time slots without recursion
  const fetchTimeSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('id, label, start_time, end_time, is_drinks')
        .order('start_time');

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Failed to load time slots');
    }
  };

  React.useEffect(() => {
    // Scroll to top when menu mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Fetch time slots
    fetchTimeSlots();
    
    // Set up subscription with debounce
    const channel = supabase
      .channel('time-slots-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_slots' },
        () => {
          // Debounce the fetch to prevent rapid re-fetching
          const timeoutId = setTimeout(() => {
            fetchTimeSlots();
          }, 1000);
          return () => clearTimeout(timeoutId);
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const [session, setSession] = React.useState(null);
  const [orderSuccess, setOrderSuccess] = React.useState<{
    orderId: string;
    roomNumber: string;
    firstName: string;
    lastName: string;
    location: Location;
  } | null>(null);
  const [dailyMenuItems, setDailyMenuItems] = React.useState<Array<{
    id: string;
    name: string;
    name_de: string;
    description: string;
    price: number;
    valid_from: string;
    valid_until: string;
    special_type: string;
    image_url: string | null;
    highlight_color: string;
    contact_phone: string;
  }>>([]);

  React.useEffect(() => {
    if (currentCategory) {
      setSelectedCategory(currentCategory);
    }
  }, [currentCategory]);

  // Simplified fetchMenuItems without pagination
  const fetchMenuItems = async (tenantId: string) => {
    if (!selectedCategory) return;

    try {
      setIsLoading(true);
      
      const { data, error: apiError } = await supabase
        .rpc('get_current_menu_items', {
          p_tenant_id: tenantId,
          p_category: selectedCategory
        });

      if (apiError) throw apiError;
      setMenuItems(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified fetchDailyMenuItems without pagination
  const fetchDailyMenuItems = async (tenantId: string) => {
    try {
      const { data, error: apiError } = await supabase
        .rpc('get_current_daily_specials', {
          p_tenant_id: tenantId
        });

      if (apiError) throw apiError;
      setDailyMenuItems(data || []);
    } catch (err) {
      console.error('Error fetching daily menu items:', err);
      setError('Failed to load daily specials');
    }
  };

  // Reset data when category changes
  React.useEffect(() => {
    setError(null);
    setMenuItems([]);
  }, [selectedCategory]);

  // Fetch data when component mounts or category changes
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Get session and tenant ID first
        const { data: { session } } = await supabase.auth.getSession();
        const tenantId = session?.user?.id;
        
        if (!tenantId) {
          setError('No tenant ID available. Please sign in.');
          return;
        }

        await Promise.all([
          fetchTimeSlots(),
          fetchMenuItems(tenantId),
          fetchDailyMenuItems(tenantId)
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedCategory]);

  React.useEffect(() => {
    if (user) {
      // Check if user has admin access
      const checkAdminAccess = async () => {
        try {
          const { data: tenantUser, error: tenantError } = await supabase
            .from('tenant_users')
            .select('role')
            .eq('auth_user_id', user.id)
            .single();

          if (tenantError) throw tenantError;

          if (tenantUser && ['owner', 'admin'].includes(tenantUser.role)) {
            navigate('/admin');
          } else {
            setLoginError('Sie haben keine Berechtigung für den Administratorzugang');
            signOut();
          }
        } catch (err) {
          console.error('Error checking admin access:', err);
          setLoginError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
          signOut();
        }
      };

      checkAdminAccess();
    }
  }, [user, navigate, signOut]);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoginError(undefined);
      await signIn(email, password);
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        setLoginError('Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail-Adresse und Ihr Passwort.');
      } else {
        setLoginError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
      throw err;
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    signOut();
    setView('welcome');
  };

  const handleViewMenu = () => {
    setSelectedCategory(getCurrentMenuCategory() || 'lunch');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin" element={
          user ? (
            <AdminPanel 
              onViewMenu={handleViewMenu}
              onReturnToAdmin={() => navigate('/admin')}
              onLogout={handleLogout}
            />
          ) : (
            <AdminLogin onLogin={handleLogin} error={loginError} setError={setLoginError} />
          )
        } />
        <Route path="/cart" element={
          <Cart 
            items={cartItems}
            onBack={() => navigate('/')}
            onSuccess={(orderDetails) => {
              setOrderSuccess(orderDetails);
              navigate('/success');
              setCartItems([]);
            }}
          />
        } />
        <Route path="/success" element={
          orderSuccess ? (
            <OrderSuccess 
              orderDetails={orderSuccess}
              onBackToMenu={() => navigate('/')}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } />
        <Route path="/menu" element={
          <>
            <Menu 
              items={menuItems}
              dailySpecials={dailyMenuItems}
              timeSlots={timeSlots}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              isLoading={isLoading}
              error={error}
              onAddToCart={(item) => {
                setCartItems(prev => [...prev, { ...item, quantity: 1 }]);
                navigate('/cart');
              }}
            />
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <TenantProvider>
        <App />
      </TenantProvider>
    </AuthProvider>
  );
}