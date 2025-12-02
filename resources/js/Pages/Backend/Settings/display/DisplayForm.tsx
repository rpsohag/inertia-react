import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function DisplayForm() {
    const { data, setData, post, processing } = useForm({
        show_recent_activity: true,
        show_notifications: true,
        show_sidebar: true,
        show_breadcrumbs: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // post(route('settings.display.update'));
    };

    const handleCheckboxChange = (field: string, checked: boolean) => {
        setData(field as any, checked);
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-medium">Display Options</h4>
                    <p className="text-sm text-muted-foreground">
                        Customize what elements are visible in the interface.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="recent"
                            checked={data.show_recent_activity}
                            onCheckedChange={(checked) =>
                                handleCheckboxChange('show_recent_activity', checked as boolean)
                            }
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="recent"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Show recent activity
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Display your recent activity in the sidebar.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="notifications"
                            checked={data.show_notifications}
                            onCheckedChange={(checked) =>
                                handleCheckboxChange('show_notifications', checked as boolean)
                            }
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="notifications"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Show notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Display notification badges and alerts.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="sidebar"
                            checked={data.show_sidebar}
                            onCheckedChange={(checked) =>
                                handleCheckboxChange('show_sidebar', checked as boolean)
                            }
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="sidebar"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Show sidebar
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Display the navigation sidebar by default.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="breadcrumbs"
                            checked={data.show_breadcrumbs}
                            onCheckedChange={(checked) =>
                                handleCheckboxChange('show_breadcrumbs', checked as boolean)
                            }
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="breadcrumbs"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Show breadcrumbs
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Display breadcrumb navigation at the top of pages.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={processing}>
                Update display
            </Button>
        </form>
    );
}
