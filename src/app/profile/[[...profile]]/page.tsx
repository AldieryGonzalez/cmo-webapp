"use client";

import { UserProfile } from "@clerk/nextjs";
import { Settings2Icon } from "lucide-react";

const UserProfilePage = () => (
    <div className="min-h-full bg-purple-900">
        <div className="container flex items-center justify-center bg-purple-900 pt-4">
            <UserProfile path="/profile">
                <UserProfile.Page
                    label="Settings"
                    url="settings"
                    labelIcon={<Settings2Icon />}
                >
                    Settings
                </UserProfile.Page>

                <UserProfile.Page label="account" />
                <UserProfile.Page label="security" />
            </UserProfile>
        </div>
    </div>
);

export default UserProfilePage;
