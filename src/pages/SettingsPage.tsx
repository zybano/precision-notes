import { useOrgAuth } from "@/contexts/OrgAuthContext";

export default function SettingsPage() {
  const { user } = useOrgAuth();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Settings</h1>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Profile Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <p className="text-slate-900">
                {user?.first_name} {user?.last_name}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <p className="text-slate-900">{user?.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Role</label>
              <p className="text-slate-900 capitalize">{user?.role}</p>
            </div>

            {user?.department && (
              <div>
                <label className="text-sm font-medium text-slate-700">Department</label>
                <p className="text-slate-900">{user.department}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
