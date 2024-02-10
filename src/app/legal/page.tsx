const Legal = () => {
    return (
        <div className="my-4">
            <h1 className="mx-auto text-center text-4xl font-black">
                Legal Notices
            </h1>
            <PrivacyPolicy />
            <TermsOfService />
        </div>
    );
};

export default Legal;

function PrivacyPolicy() {
    return (
        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-4 rounded-md bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-3xl font-semibold">Privacy Policy</h2>

            <p>
                <span className="font-bold">Introduction:</span> Welcome to the
                Northwestern University Concert Management Office{"'"}s Employee
                Shift Management App Privacy Policy. This document outlines how
                we handle your information as you engage with our app.
            </p>

            <p>
                <span className="font-bold">Information Collected:</span> Our
                app utilizes the Google Calendar API to retrieve and display
                shift information for Northwestern University Concert Management
                employees. We collect only the shifts you take for internal
                purposes, enhancing functionality such as shift cart management
                and cross-device persistence.
            </p>

            <p>
                <span className="font-bold">Use of Information:</span> The
                collected shift information is used exclusively within the app,
                aiding employees in managing their schedules efficiently. No
                personal information is collected or shared with third parties,
                except for internal use within the Concert Management Office.
            </p>

            <p>
                <span className="font-bold">Data Security:</span> We prioritize
                the security of your information. Shift data is stored securely
                in a database, and authentication is handled through Clerk using
                OAuth for Google accounts.
            </p>

            <p>
                <span className="font-bold">User Control:</span> You have the
                option to opt out of certain features, such as checking for
                conflicting events with other calendars. Additionally, you can
                delete your account, ensuring control over your data.
            </p>

            <p>
                <span className="font-bold">Updates to Privacy Policy:</span>{" "}
                Any changes to the Privacy Policy will be communicated through a
                popup on page load, keeping you informed about how your data is
                handled.
            </p>

            <p>
                <span className="font-bold">Contact Information:</span> For any
                privacy-related concerns or questions, please contact us at
                4078671186 or aldieryrgon@gmail.com.
            </p>
        </div>
    );
}

function TermsOfService() {
    return (
        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-4 rounded-md bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-3xl font-semibold">Terms of Service</h2>

            <p>
                <span className="font-bold">Acceptance of Terms:</span> By using
                the Northwestern University Concert Management Office{"'"}s
                Employee Shift Management App, you agree to the terms outlined
                in this document. The app is designed to streamline shift
                management for Concert Management employees.
            </p>

            <p>
                <span className="font-bold">User Conduct:</span> Spamming and
                attempts to gather information for malicious purposes are
                strictly prohibited. Respectful and responsible use of the app
                is expected.
            </p>

            <p>
                <span className="font-bold">Intellectual Property:</span> This
                app uses registered businesses of Northwestern University, and
                all other designs are created by Aldiery Gonzalez. Users are
                granted rights to app content within the boundaries of fair use.
            </p>

            <p>
                <span className="font-bold">Termination of Service:</span> We
                reserve the right to terminate service for users who violate the
                terms outlined in this document.
            </p>

            <p>
                <span className="font-bold">Governing Law:</span> Any disputes
                will be governed by the laws applicable to Northwestern
                University and its associated entities.
            </p>

            <p>
                <span className="font-bold">Contact Information:</span> For
                questions or concerns related to the Terms of Service, please
                reach out to us at 4078671186 or aldieryrgon@gmail.com.
            </p>
        </div>
    );
}
