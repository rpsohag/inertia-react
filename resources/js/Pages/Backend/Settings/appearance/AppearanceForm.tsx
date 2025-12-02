import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/components/theme-provider';

export default function AppearanceForm() {
    const { theme, setTheme } = useTheme();
    const { data, setData, post, processing } = useForm({
        theme: theme || 'system',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setTheme(data.theme as 'light' | 'dark' | 'system');
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="space-y-4">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                    Select the theme for the dashboard.
                </p>
                <RadioGroup
                    value={data.theme}
                    onValueChange={(value) => setData('theme', value)}
                    className="grid gap-4"
                >
                    <div className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light" className="font-normal cursor-pointer">
                            <div className="flex flex-col">
                                <span className="font-medium">Light</span>
                                <span className="text-sm text-muted-foreground">
                                    Light mode theme
                                </span>
                            </div>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="dark" id="dark" />
                        <Label htmlFor="dark" className="font-normal cursor-pointer">
                            <div className="flex flex-col">
                                <span className="font-medium">Dark</span>
                                <span className="text-sm text-muted-foreground">
                                    Dark mode theme
                                </span>
                            </div>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="system" id="system" />
                        <Label htmlFor="system" className="font-normal cursor-pointer">
                            <div className="flex flex-col">
                                <span className="font-medium">System</span>
                                <span className="text-sm text-muted-foreground">
                                    Use system theme
                                </span>
                            </div>
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <Button type="submit" disabled={processing}>
                Update preferences
            </Button>
        </form>
    );
}
