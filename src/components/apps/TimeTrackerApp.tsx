import AuthGate from '@/components/auth/AuthGate';
import TimeLogForm from '@/components/atoms/TimeLogForm';

export default function TimeTrackerApp() {
    return (
        <AuthGate>
            <TimeLogForm />
        </AuthGate>
    );
}
