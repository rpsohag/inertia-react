import SettingsLayout from '@/Layouts/SettingsLayout';
import ContentSection from '../components/content-section';
import ProfileForm from './ProfileForm';

export default function SettingsProfile() {
    return (
        <SettingsLayout title="User Profile">
            <ContentSection
                title="Profile"
                desc="This is how others will see you on the site."
            >
                <ProfileForm />
            </ContentSection>
        </SettingsLayout>
    );
}
