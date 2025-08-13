import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

export const getOrderStatusConfig = (status: string | undefined) => {
  switch (status) {
    case 'pending':
      return { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pendiente' };
    case 'confirmed':
      return { color: 'processing', icon: <CheckCircleOutlined />, text: 'Confirmada' };
    case 'completed':
      return { color: 'success', icon: <CheckCircleOutlined />, text: 'Completada' };
    case 'cancelled':
      return { color: 'error', icon: <CloseCircleOutlined />, text: 'Cancelada' };
    default:
      return { color: 'default', icon: <ExclamationCircleOutlined />, text: 'Sin estado' };
  }
};
