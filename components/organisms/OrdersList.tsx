import { Order, OrdersState } from '@/types/admin';
import { formatPrice, renderDateTime } from '@/utils/formatters';
import { Timestamp } from '@/utils/server/firebase';
import { CalendarOutlined, EyeOutlined, PhoneOutlined } from '@ant-design/icons';
import { Button, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getOrderStatusConfig } from '../atoms/StatusConfig';

const { Text } = Typography;
const { Option } = Select;

interface Props {
  ordersState: OrdersState;
  showOrderDetails: (record: Order) => void;
  updateOrderStatus: (orderId: string, newStatus: string) => void;
}

export const AdminOrdersList = ({ ordersState, showOrderDetails, updateOrderStatus }: Props) => {
  const filteredOrders = ordersState.orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(ordersState.searchTerm.toLowerCase()) ||
      order.customerPhoneNumber.includes(ordersState.searchTerm),
  );

  const columns: ColumnsType<Order> = [
    {
      title: 'Orden',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: Order) => (
        <Space direction="vertical" size={0}>
          <Text strong>#{text}</Text>
          {record.isTest && <Tag color="orange">TEST</Tag>}
        </Space>
      ),
    },
    {
      title: 'Cliente',
      key: 'customer',
      responsive: ['md'],
      render: (record: Order) => (
        <Space direction="vertical" size={0}>
          <Space>
            <PhoneOutlined />
            <Text>{record.customerPhoneNumber}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Transferencia: {record.transfersPhoneNumber}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = getOrderStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Total',
      key: 'total',
      responsive: ['sm'],
      render: (record: Order) => (
        <Space direction="vertical" size={0}>
          <Text strong>{formatPrice(record.total)}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Sub: {formatPrice(record.subtotal)}
            {record.deliveryTotal > 0 && ` + ${formatPrice(record.deliveryTotal)}`}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['lg'],
      render: (date: Timestamp) => (
        <Space>
          <CalendarOutlined />
          <Text>{renderDateTime(date.valueOf())}</Text>
        </Space>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: Order) => (
        <Space direction="vertical" size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showOrderDetails(record)}
          >
            Ver
          </Button>
          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Select
              size="small"
              placeholder="Cambiar estado"
              style={{ width: 120 }}
              onChange={(value: string) => updateOrderStatus(record.id, value)}
            >
              {record.status === 'pending' && (
                <>
                  <Option value="confirmed">Confirmar</Option>
                  <Option value="cancelled">Cancelar</Option>
                </>
              )}
              {record.status === 'confirmed' && (
                <>
                  <Option value="completed">Completar</Option>
                  <Option value="cancelled">Cancelar</Option>
                </>
              )}
            </Select>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={filteredOrders}
      rowKey="id"
      loading={ordersState.loading}
      scroll={{ x: true }}
      size="middle"
      // pagination={{
      //   current: currentPage,
      //   total: pagination?.total || 0,
      //   pageSize: 20,
      //   showSizeChanger: false,
      //   showQuickJumper: true,
      //   showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} órdenes`,
      //   onChange: (page) => setState((prev) => ({ ...prev, currentPage: page })),
      //   responsive: true,
      // }}
      locale={{
        emptyText: ordersState.searchTerm
          ? 'No se encontraron órdenes con esos términos'
          : 'No hay órdenes para mostrar',
      }}
    />
  );
};
