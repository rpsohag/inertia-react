import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function NotificationsForm() {
    const { data, setData, post, processing } = useForm({
        communication_emails: false,
        marketing_emails: false,
        social_emails: true,
        security_emails: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // post(route('settings.notifications.update'));
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                        Choose what notifications you want to receive via email.
                    </p>
                </div>
                <Separator />
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="communication">Communication emails</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive emails about your account activity.
                            </p>
                        </div>
                        <Switch
                            id="communication"
                            checked={data.communication_emails}
                            onCheckedChange={(checked) =>
                                setData('communication_emails', checked)
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="marketing">Marketing emails</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive emails about new products, features, and more.
                            </p>
                        </div>
                        <Switch
                            id="marketing"
                            checked={data.marketing_emails}
                            onCheckedChange={(checked) =>
                                setData('marketing_emails', checked)
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="social">Social emails</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive emails for friend requests, follows, and more.
                            </p>
                        </div>
                        <Switch
                            id="social"
                            checked={data.social_emails}
                            onCheckedChange={(checked) => setData('social_emails', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="security">Security emails</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive emails about your account security.
                            </p>
                        </div>
                        <Switch
                            id="security"
                            checked={data.security_emails}
                            onCheckedChange={(checked) => setData('security_emails', checked)}
                            disabled
                        />
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={processing}>
                Update notifications
            </Button>
        </form>
    );
}
