import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getMyOrders, Commande } from '@/services/commande.service';
import LuxuryNavbar from '@/components/home/LuxuryNavbar';

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? '';

const resolveImg = (path: string | undefined): string => {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http")) return path;
  if (path.startsWith("[")) {
    try {
      const arr = JSON.parse(path);
      if (arr[0]) return `${IMAGE_BASE}${arr[0]}`;
    } catch { }
  }
  return `${IMAGE_BASE}${path}`;
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Commande[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await getMyOrders();
        setOrders(data);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading, isAuthenticated, router]);

  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'processing': return 'Confirmée';
      case 'shipped': return 'Expédiée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <>
      <LuxuryNavbar transparent={false} />
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '110px 24px 48px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, fontSize: 32, color: '#1a1a1a', marginBottom: 24 }}>
            Mes Commandes
          </h1>

          {isLoading ? (
            <div style={{ background: '#fff', padding: '40px', textAlign: 'center', border: '1px solid #e8e8e8' }}>
              Chargement de vos commandes...
            </div>
          ) : error ? (
            <div style={{ background: '#fff', padding: '40px', color: '#8b1f1f', border: '1px solid #f0d2d2' }}>
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div style={{ background: '#fff', padding: '60px 40px', textAlign: 'center', border: '1px solid #e8e8e8' }}>
              <p style={{ color: '#666', fontSize: 16 }}>Vous n'avez passé aucune commande pour le moment.</p>
              <button
                onClick={() => router.push('/')}
                style={{ marginTop: 20, padding: '12px 24px', background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1a1a1a')}
              >
                Découvrir nos produits
              </button>
            </div>
          ) : (
            <>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'Toutes' },
                  { value: 'pending', label: 'En attente' },
                  { value: 'processing', label: 'Confirmée' },
                  { value: 'shipped', label: 'Expédiée' },
                  { value: 'delivered', label: 'Livrée' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    style={{
                      padding: '8px 16px',
                      background: filter === f.value ? '#1a1a1a' : '#fff',
                      color: filter === f.value ? '#fff' : '#1a1a1a',
                      border: '1px solid #1a1a1a',
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'all 0.2s',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {orders.filter((o) => filter === 'all' || o.status === filter).length === 0 ? (
                <div style={{ background: '#fff', padding: '40px', textAlign: 'center', border: '1px solid #e8e8e8' }}>
                  <p style={{ color: '#666', fontSize: 15 }}>Aucune commande ne correspond à ce filtre.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {orders
                    .filter((o) => filter === 'all' || o.status === filter)
                    .map((order) => (
                      <div key={order.id} style={{ background: '#fff', border: '1px solid #e8e8e8' }}>
                  {/* Header */}
                  <div style={{ borderBottom: '1px solid #e8e8e8', padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Commande passee le</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Total</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{Number(order.totalAmount).toFixed(2)} DT</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>N° de commande</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{order.id.split('-')[0].toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Statut:</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: statusColor(order.status), background: `${statusColor(order.status)}1a`, padding: '4px 12px', borderRadius: 20 }}>
                        {translateStatus(order.status)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {order.items?.map((item) => {
                        const rawImages = item.product?.images;
                        const imageArray: string[] = Array.isArray(rawImages)
                          ? rawImages
                          : typeof rawImages === 'string' && rawImages.startsWith('[')
                            ? (() => { try { return JSON.parse(rawImages); } catch { return []; } })()
                            : rawImages ? [rawImages] : [];
                        const img = imageArray[0] ? resolveImg(imageArray[0]) : undefined;
                        
                        return (
                          <div key={item.id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ width: 80, height: 80, background: '#f5f5f5', flexShrink: 0 }}>
                              {img && <img src={img} alt={item.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 500 }}>{item.product?.name || 'Produit inconnu'}</p>
                              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#666' }}>Qté: {item.quantity}</p>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>
                              {Number(item.priceAtPurchase).toFixed(2)} DT
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
