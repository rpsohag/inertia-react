import SettingsLayout from '@/Layouts/SettingsLayout';
import ContentSection from '../components/content-section';
import NotificationsForm from './NotificationsForm';

export default function SettingsNotifications() {
    return (
        <SettingsLayout title="Notifications Settings">
            <ContentSection
                title="Notifications"
                desc="Configure how you receive notifications."
            >
                <NotificationsForm />
            </ContentSection>
        </SettingsLayout>
    );
}
