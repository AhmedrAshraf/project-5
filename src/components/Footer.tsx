import React from 'react';
import { Mail, Phone, LogIn, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { TenantContext } from '../contexts/TenantContext';

export function Footer() {
  const navigate = useNavigate();
  const { tenant } = React.useContext(TenantContext);

  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-100 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img
              src={tenant?.settings.theme.logo_url || "https://ik.imagekit.io/5v05edcvce/Logo_Trans_Lyja.png"}
              alt={tenant?.name || "LYJA Resort"}
              className="h-12 w-auto mb-4"
            />
            <p className="text-gray-600 text-sm">
              Genießen Sie kulinarische Highlights in entspannter Atmosphäre.
            </p>
          </div>
          
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Kontakt</h3>
            <div className="space-y-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openAdmin'))}
                className="flex items-center text-gray-600 hover:text-accent gap-2"
              >
                <span>Admin Login</span>
              </button>
              <Link
                to="/signin"
                className="flex items-center text-gray-600 hover:text-accent gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Mitarbeiter Login</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center text-gray-600 hover:text-accent gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrieren</span>
              </Link>
              <a href={`tel:${tenant?.settings.contact_info.phone || '+123456789'}`} className="flex items-center text-gray-600 hover:text-accent">
                <Phone className="w-4 h-4 mr-2" />
                <span>{tenant?.settings.contact_info.phone || '+49 123 456789'}</span>
              </a>
              <a href={`mailto:${tenant?.settings.contact_info.email || 'info@lyja-resort.com'}`} className="flex items-center text-gray-600 hover:text-accent">
                <Mail className="w-4 h-4 mr-2" />
                <span>{tenant?.settings.contact_info.email || 'info@lyja-resort.com'}</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Öffnungszeiten</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Mo-Fr: {tenant?.settings.business_hours.monday_friday.open} - {tenant?.settings.business_hours.monday_friday.close} Uhr</p>
              <p>Sa: {tenant?.settings.business_hours.saturday.open} - {tenant?.settings.business_hours.saturday.close} Uhr</p>
              <p>So: {tenant?.settings.business_hours.sunday.open} - {tenant?.settings.business_hours.sunday.close} Uhr</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {tenant?.name || 'LYJA Resort'}. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}