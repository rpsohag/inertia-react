import { useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AccountForm() {
    const { data, setData, post, processing, errors } = useForm({
        language: "en",
        timezone: "UTC",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // post(route('settings.account.update'));
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                    value={data.language}
                    onValueChange={(value) => setData("language", value)}
                >
                    <SelectTrigger id="language" className="w-2xs">
                        <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                </Select>
                {errors.language && (
                    <p className="text-sm text-destructive">
                        {errors.language}
                    </p>
                )}
                <p className="text-sm text-muted-foreground">
                    This is the language that will be used in the dashboard.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                    value={data.timezone}
                    onValueChange={(value) => setData("timezone", value)}
                >
                    <SelectTrigger id="timezone" className="w-2xs">
                        <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">
                            Eastern Time (ET)
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                            Central Time (CT)
                        </SelectItem>
                        <SelectItem value="America/Denver">
                            Mountain Time (MT)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                            Pacific Time (PT)
                        </SelectItem>
                        <SelectItem value="Europe/London">
                            London (GMT)
                        </SelectItem>
                        <SelectItem value="Europe/Paris">
                            Paris (CET)
                        </SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        <SelectItem value="Asia/Shanghai">
                            Shanghai (CST)
                        </SelectItem>
                    </SelectContent>
                </Select>
                {errors.timezone && (
                    <p className="text-sm text-destructive">
                        {errors.timezone}
                    </p>
                )}
                <p className="text-sm text-muted-foreground">
                    Select the timezone you want to use for the dashboard.
                </p>
            </div>

            <Button type="submit" disabled={processing}>
                Update account
            </Button>
        </form>
    );
}
