import { useOrgAuth } from "@/contexts/OrgAuthContext";

export default function ProfilePage() {
  const { user } = useOrgAuth();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">My Profile</h1>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-700">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">First Name</label>
                <p className="mt-1 text-slate-900">{user?.first_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Last Name</label>
                <p className="mt-1 text-slate-900">{user?.last_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <p className="mt-1 text-slate-900">{user?.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <p className="mt-1 text-slate-900 capitalize">{user?.role}</p>
              </div>

              {user?.department && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Department</label>
                  <p className="mt-1 text-slate-900">{user.department}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700">Organization ID</label>
                <p className="mt-1 text-slate-900 font-mono text-sm">{user?.organization_id}</p>
              </div>
            </div>

            {user?.last_login_at && (
              <div>
                <label className="text-sm font-medium text-slate-700">Last Login</label>
                <p className="mt-1 text-slate-900">
                  {new Date(user.last_login_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
