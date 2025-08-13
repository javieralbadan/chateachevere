'use client';
import { OrderDetails } from '@/components/organisms/OrderDetails';
import { AdminOrdersList } from '@/components/organisms/OrdersList';
import { Order, OrdersResponse, OrdersState } from '@/types/admin';
import { DollarOutlined, LogoutOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Drawer,
  Input,
  Layout,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useAdminContext } from './layout';

const { Title, Text } = Typography;
const { Header, Content } = Layout;
const { Option } = Select;

export default function AdminPanel() {
  const { session, loading: sessionLoading, error, logout, tenantId } = useAdminContext();

  const [state, setState] = useState<OrdersState>({
    orders: [],
    pagination: null,
    loading: false,
    currentPage: 1,
    statusFilter: 'all',
    searchTerm: '',
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const searchParams = new URLSearchParams({
        token: new URLSearchParams(window.location.search).get('token') || '',
        tenantId,
        page: state.currentPage.toString(),
        limit: '20',
        status: state.statusFilter,
      });

      const response = await fetch(`/api/admin/orders?${searchParams}`);
      const data: OrdersResponse = (await response.json()) as OrdersResponse;

      if (data.success && data.data) {
        setState((prev) => ({
          ...prev,
          orders: data.data?.orders || [],
          pagination: data.data
            ? {
                ...data.data.pagination,
                page: prev.currentPage,
                limit: 20,
                hasNext: prev.currentPage < data.data.pagination.totalPages,
                hasPrev: prev.currentPage > 1,
              }
            : null,
        }));
      }
    } catch (err) {
      console.error('Error cargando órdenes', err);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.currentPage, state.statusFilter, tenantId]);

  useEffect(() => {
    if (session) {
      void fetchOrders();
    }
  }, [session, fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = new URLSearchParams(window.location.search).get('token');
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          tenantId,
          orderId,
          status: newStatus,
        }),
      });
      const data: OrdersResponse = (await response.json()) as OrdersResponse;
      if (data.success) {
        // message.success('Estado actualizado correctamente');
        await fetchOrders();
      } else {
        // message.error(data.error || 'Error actualizando orden');
      }
    } catch (err) {
      console.log('🚀 ~ updateOrderStatus ~ err:', err);
      // message.error('Error actualizando orden');
    }
  };

  const showOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDrawerVisible(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Result
          status="error"
          title="Error de Acceso"
          subTitle={error}
          extra={<Text type="secondary">Serás redirigido automáticamente...</Text>}
        />
      </div>
    );
  }

  if (sessionLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-white shadow-sm px-4">
        <Row justify="space-between" align="middle" className="h-full">
          <Col>
            <Title level={4} className="m-0 text-gray-900">
              Panel Admin - {tenantId.toUpperCase()} [{session.phoneNumber}]
            </Title>
          </Col>
          <Col>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
              }}
              type="text"
              className="text-gray-600"
            >
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </Col>
        </Row>
      </Header>

      <Content className="p-4">
        <Space direction="vertical" size="large" className="w-full">
          {/* Controles de búsqueda y filtros */}
          <Card>
            <Space direction="vertical" size="middle" className="w-full">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12} md={16}>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Buscar por orden o teléfono..."
                    value={state.searchTerm}
                    onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value }))}
                    allowClear
                  />
                </Col>
                <Col xs={12} sm={6} md={4}>
                  <Select
                    value={state.statusFilter}
                    onChange={(value) => setState((prev) => ({ ...prev, statusFilter: value }))}
                    style={{ width: '100%' }}
                    placeholder="Estado"
                  >
                    <Option value="all">Todos</Option>
                    <Option value="pending">Pendiente</Option>
                    <Option value="confirmed">Confirmada</Option>
                    <Option value="completed">Completada</Option>
                    <Option value="cancelled">Cancelada</Option>
                  </Select>
                </Col>
                <Col xs={12} sm={6} md={4}>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      void fetchOrders();
                    }}
                    loading={state.loading}
                    style={{ width: '100%' }}
                  >
                    <span className="hidden sm:inline">Actualizar</span>
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Estadísticas rápidas */}
          <Card>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total Órdenes"
                  value={state.pagination?.total || 0}
                  prefix={<DollarOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Órdenes Confirmadas"
                  value={state.orders.filter(({ status }) => status === 'confirmed').length || 0}
                  prefix={<DollarOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Órdenes Pendientes"
                  value={state.orders.filter(({ status }) => status === 'pending').length || 0}
                  prefix={<DollarOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* Tabla de órdenes */}
          <Card>
            <AdminOrdersList
              ordersState={state}
              showOrderDetails={showOrderDetails}
              updateOrderStatus={(orderId, status) => void updateOrderStatus(orderId, status)}
            />
          </Card>
        </Space>
      </Content>

      {/* Drawer para detalles de orden */}
      <Drawer
        title={`Orden #${selectedOrder?.orderNumber || ''}`}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width="90%"
      >
        {selectedOrder && <OrderDetails selectedOrder={selectedOrder} />}
      </Drawer>
    </Layout>
  );
}
