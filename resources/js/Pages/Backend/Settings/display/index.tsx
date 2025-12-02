import SettingsLayout from '@/Layouts/SettingsLayout';
import ContentSection from '../components/content-section';
import DisplayForm from './DisplayForm';

export default function SettingsDisplay() {
    return (
        <SettingsLayout title="Display Settings">
            <ContentSection
                title="Display"
                desc="Turn items on or off to control what's displayed in the app."
            >
                <DisplayForm />
            </ContentSection>
        </SettingsLayout>
    );
}
