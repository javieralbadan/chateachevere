import { Order } from '@/types/admin';
import { formatPrice, renderDateTime } from '@/utils/formatters';
import { CalendarOutlined, PhoneOutlined } from '@ant-design/icons';
import { Badge, Card, Col, Descriptions, Divider, Row, Space, Tag, Typography } from 'antd';
import { getOrderStatusConfig } from '../atoms/StatusConfig';

const { Text } = Typography;

export const OrderDetails = ({ selectedOrder }: { selectedOrder: Order }) => {
  if (!selectedOrder) {
    return null;
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Cliente">
          <Space>
            <PhoneOutlined />
            {selectedOrder.customerPhoneNumber}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Estado">
          {(() => {
            const config = getOrderStatusConfig(selectedOrder.status);
            return (
              <Tag color={config.color} icon={config.icon}>
                {config.text}
              </Tag>
            );
          })()}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha">
          <Space>
            <CalendarOutlined />
            {renderDateTime(selectedOrder.createdAt.valueOf())}
          </Space>
        </Descriptions.Item>
        {selectedOrder.isTest && (
          <Descriptions.Item label="Tipo">
            <Badge status="warning" text="Orden de Prueba" />
          </Descriptions.Item>
        )}
      </Descriptions>

      <Card title="Items del Pedido" size="small">
        <Space direction="vertical" className="w-full">
          {selectedOrder.cart.map((item, index) => (
            <Card key={index} size="small" className="bg-gray-50">
              <Row justify="space-between" align="middle">
                <Col flex="auto">
                  <Space direction="vertical" size={0}>
                    <Text strong>{item.name}</Text>
                  </Space>
                </Col>
                <Col>
                  <Space direction="vertical" size={0} align="end">
                    <Text>
                      {item.quantity} × {formatPrice(item.price)}
                    </Text>
                    {item.quantity > 1 && (
                      <Text strong>{formatPrice(item.quantity * item.price)}</Text>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </Card>

      <Card title="Costos Finales" size="small">
        <Space direction="vertical" className="w-full">
          <Row justify="space-between">
            <Col>
              <Text>Subtotal:</Text>
            </Col>
            <Col>
              <Text>{formatPrice(selectedOrder.subtotal)}</Text>
            </Col>
          </Row>
          {selectedOrder.deliveryTotal > 0 && (
            <Row justify="space-between">
              <Col>
                <Text>Domicilio:</Text>
              </Col>
              <Col>
                <Text>{formatPrice(selectedOrder.deliveryTotal)}</Text>
              </Col>
            </Row>
          )}
          <Divider className="my-2" />
          <Row justify="space-between">
            <Col>
              <Text strong>Total:</Text>
            </Col>
            <Col>
              <Text strong className="text-lg">
                {formatPrice(selectedOrder.total)}
              </Text>
            </Col>
          </Row>
        </Space>
      </Card>
    </Space>
  );
};
