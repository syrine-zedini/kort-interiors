import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, UserProfile } from '@/services/user.service';
import LuxuryNavbar from '@/components/home/LuxuryNavbar';
import AuthModal from '@/components/home/AuthModal';

export default function ProfileView() {
  const router = useRouter();
  const authContext = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Decode role from JWT token stored in localStorage
  const getRoleFromToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload).role || null;
    } catch (e) {
      console.error('Failed to parse token:', e);
      return null;
    }
  };

  const userRole = getRoleFromToken() || authContext.user?.role || profile?.role;
  const isAdmin = userRole === 'SuperAdmin' || userRole === 'Admin';

  useEffect(() => {
    if (authContext.isLoading) {
      return;
    }

    // Check authentication - only if auth is fully loaded
    if (!authContext.isAuthenticated) {
      setError('not_authenticated');
      setIsLoading(false);
      return;
    }

    // Auth is valid — clear any previous error and fetch profile
    setError(null);

    const fetchProfile = async (attempt = 0) => {
      try {
        setIsLoading(true);
        const data = await getUserProfile();
        setProfile(data);
        setError(null);
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        if (err.message === 'Network Error' && attempt === 0) {
          setTimeout(() => fetchProfile(1), 800);
          return;
        }
        setError(err.response?.data?.message || err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [authContext.isLoading, authContext.isAuthenticated]);

  if (isLoading) {
    return (
      <>
        <LuxuryNavbar transparent={false} />
        <div
          style={{
            minHeight: '100vh',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '96px 24px 24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              padding: '24px 28px',
              fontSize: 14,
              color: '#666',
              letterSpacing: 0.2,
            }}
          >
            Chargement du profil...
          </div>
        </div>
      </>
    );
  }

  if (error === 'not_authenticated') {
    return (
      <>
        <LuxuryNavbar transparent={false} />
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <div
          style={{
            minHeight: '100vh',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '96px 24px 24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              padding: '32px 36px',
              maxWidth: 420,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 10,
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                color: '#8a8a8a',
                marginBottom: 12,
              }}
            >
              Accès restreint
            </p>
            <p style={{ fontSize: 15, color: '#1a1a1a', marginBottom: 24 }}>
              Vous devez être connecté pour accéder à votre profil.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              style={{
                padding: '13px 32px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Se connecter
            </button>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <LuxuryNavbar transparent={false} />
        <div
          style={{
            minHeight: '100vh',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '96px 24px 24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #f0d2d2',
              color: '#8b1f1f',
              padding: '20px 24px',
              fontSize: 14,
              maxWidth: 520,
              width: '100%',
            }}
          >
            {error}
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <LuxuryNavbar transparent={false} />
        <div
          style={{
            minHeight: '100vh',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '96px 24px 24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              padding: '24px 28px',
              fontSize: 14,
              color: '#666',
            }}
          >
            Aucune information de profil disponible.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LuxuryNavbar transparent={false} />
      <div
        style={{
          minHeight: '100vh',
          background: '#f5f5f5',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          padding: '110px 24px 48px',
        }}
      >
        <div
          style={{
            maxWidth: 920,
            margin: '0 auto',
          }}
        >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e8e8e8',
            padding: '36px 40px',
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                color: '#8a8a8a',
                margin: '0 0 10px',
              }}
            >
              Mon compte
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 400,
                fontSize: 36,
                color: '#1a1a1a',
                lineHeight: 1.2,
              }}
            >
              Mon profil
            </h1>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 18,
            }}
          >
            <div>
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 10,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: '#7a7a7a',
                }}
              >
                Nom d'utilisateur
              </p>
              <div
                style={{
                  border: '1px solid #e8e8e8',
                  background: '#fafafa',
                  padding: '12px 14px',
                  fontSize: 14,
                  color: '#1a1a1a',
                }}
              >
                {profile.username}
              </div>
            </div>

            <div>
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 10,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: '#7a7a7a',
                }}
              >
                Email
              </p>
              <div
                style={{
                  border: '1px solid #e8e8e8',
                  background: '#fafafa',
                  padding: '12px 14px',
                  fontSize: 14,
                  color: '#1a1a1a',
                }}
              >
                {profile.email || 'Non renseigne'}
              </div>
            </div>

            <div>
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 10,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: '#7a7a7a',
                }}
              >
                Numero de telephone
              </p>
              <div
                style={{
                  border: '1px solid #e8e8e8',
                  background: '#fafafa',
                  padding: '12px 14px',
                  fontSize: 14,
                  color: '#1a1a1a',
                }}
              >
                {profile.phoneNumber || 'Non renseigne'}
              </div>
            </div>

            <div>
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 10,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: '#7a7a7a',
                }}
              >
                Adresse
              </p>
              <div
                style={{
                  border: '1px solid #e8e8e8',
                  background: '#fafafa',
                  padding: '12px 14px',
                  fontSize: 14,
                  color: '#1a1a1a',
                }}
              >
                {profile.address || 'Non renseigne'}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 30,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => router.push('/edit-profile')}
              style={{
                padding: '13px 24px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a1a';
              }}
            >
              Modifier mon profil
            </button>

            <button
              onClick={() => router.push('/')}
              style={{
                padding: '13px 24px',
                background: '#fff',
                color: '#1a1a1a',
                border: '1px solid #d8d8d8',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Retour a l'accueil
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  let adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
                  if (!adminUrl) {
                    const hostname = window.location.hostname;
                    const protocol = window.location.protocol;
                    
                    if (hostname === 'localhost' || hostname === '127.0.0.1') {
                      adminUrl = 'http://localhost:3000';
                    } else {
                      const port = window.location.port;
                      if (port) {
                        // Si accès par port en production/staging, on bascule sur le port admin 3000
                        adminUrl = `${protocol}//${hostname}:3000`;
                      } else {
                        // Sinon, format sous-domaine standard (ex: admin.votresite.com)
                        adminUrl = `${protocol}//admin.${hostname.replace('www.', '')}`;
                      }
                    }
                  }
                  window.location.href = adminUrl;
                }}
                style={{
                  padding: '13px 24px',
                  background: '#d4af37',
                  color: '#fff',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#c19a28';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#d4af37';
                }}
              >
                Voir dashboard
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
