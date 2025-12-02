import SettingsLayout from '@/Layouts/SettingsLayout';
import ContentSection from '../components/content-section';
import AccountForm from './AccountForm';

export default function SettingsAccount() {
    return (
        <SettingsLayout title="Account Settings">
            <ContentSection
                title="Account"
                desc="Update your account settings. Set your preferred language and timezone."
            >
                <AccountForm />
            </ContentSection>
        </SettingsLayout>
    );
}
