import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProfileForm() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        email: '',
        bio: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // post(route('settings.profile.update'));
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                    placeholder="Enter your username"
                />
                {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                )}
                <p className="text-sm text-muted-foreground">
                    This is your public display name. It can be your real name or a pseudonym.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="Enter your email"
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                )}
                <p className="text-sm text-muted-foreground">
                    You can manage verified email addresses in your email settings.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    value={data.bio}
                    onChange={(e) => setData('bio', e.target.value)}
                    placeholder="Tell us a little bit about yourself"
                    className="resize-none"
                    rows={4}
                />
                {errors.bio && (
                    <p className="text-sm text-destructive">{errors.bio}</p>
                )}
                <p className="text-sm text-muted-foreground">
                    You can @mention other users and organizations to link to them.
                </p>
            </div>

            <Button type="submit" disabled={processing}>
                Update profile
            </Button>
        </form>
    );
}
