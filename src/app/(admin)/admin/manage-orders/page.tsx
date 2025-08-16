import { AdminOrdersView } from "@/features/orders/ui/views/admin-orders-view";

export default function ManageOrdersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
        <p className="text-gray-600">View and manage all customer orders</p>
      </div>
      <AdminOrdersView />
    </div>
  );
}