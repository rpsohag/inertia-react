import SettingsLayout from '@/Layouts/SettingsLayout';
import ContentSection from '../components/content-section';
import AppearanceForm from './AppearanceForm';

export default function SettingsAppearance() {
    return (
        <SettingsLayout title="Appearance Settings">
            <ContentSection
                title="Appearance"
                desc="Customize the appearance of the app. Automatically switch between day and night themes."
            >
                <AppearanceForm />
            </ContentSection>
        </SettingsLayout>
    );
}
