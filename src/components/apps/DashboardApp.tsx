import AuthGate from '@/components/auth/AuthGate';
import { DashboardTable } from '@/components/atoms/DashboardTable';

export default function DashboardApp() {
    return (
        <AuthGate>
            <DashboardTable />
        </AuthGate>
    );
}
