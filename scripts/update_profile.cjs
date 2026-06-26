const fs = require('fs');
const path = 'c:/Users/nirza/cocpit-admin-dashboard/admin-frontend/src/pages/UserProfile.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Imports
content = content.replace(
  `import { useNavigate, useLocation } from 'react-router-dom';`,
  `import { useNavigate, useLocation, useParams } from 'react-router-dom';\nimport { format, formatDistanceToNow } from 'date-fns';`
);

// 2. Component state and fetch
const stateRegex = /export default function UserProfile\(\) \{\n  const \{ role \} = useAuth\(\);\n  const navigate = useNavigate\(\);\n  const location = useLocation\(\);/s;
content = content.replace(stateRegex, `export default function UserProfile() {
  const { role, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!id || !accessToken) return;
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/admin/users/' + id, {
          headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, accessToken]);

  if (loading) return <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
  if (!userData) return <div className="flex justify-center p-10">User not found</div>;
`);

// 3. User Basic info
content = content.replace(
  /Omar Al-Fayed Avatar/g,
  `\${userData.name} Avatar`
);
content = content.replace(
  /src="https:\/\/ui-avatars.com\/api\/\?name=Omar\+Al-Fayed&background=3525cd&color=fff&size=256"/g,
  `src={userData.avatar || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(userData.name || 'User')}&background=3525cd&color=fff&size=256\`}`
);

content = content.replace(
  /<h2 className="font-display-lg text-display-lg text-on-surface">Omar Al-Fayed<\/h2>/g,
  `<h2 className="font-display-lg text-display-lg text-on-surface">{userData.name}</h2>`
);
content = content.replace(
  /<span className="bg-primary-container text-on-primary-container font-label-md text-label-md px-sm py-xs rounded-lg">Admin<\/span>/g,
  `<span className="bg-primary-container text-on-primary-container font-label-md text-label-md px-sm py-xs rounded-lg">{userData.role}</span>`
);
content = content.replace(
  /<p className="text-on-surface-variant font-body-md text-body-md">User ID: #USR-99421 • Joined Jan 12, 2021<\/p>/g,
  `<p className="text-on-surface-variant font-body-md text-body-md">User ID: #{userData.id.split('-')[0]} • Joined {userData.joined ? format(new Date(userData.joined), 'MMM d, yyyy') : 'Unknown'}</p>`
);

content = content.replace(
  /<span className="bg-green-100 text-green-700 font-label-md text-label-md px-sm py-xs rounded-lg flex items-center gap-1">\s*<span className="material-symbols-outlined text-\[14px\]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle<\/span>\s*Active\s*<\/span>/g,
  `<span className={\`font-label-md text-label-md px-sm py-xs rounded-lg flex items-center gap-1 \${userData.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-error-container text-error'}\`}>
    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{userData.status === 'Active' ? 'check_circle' : 'cancel'}</span>
    {userData.status}
  </span>`
);

// 4. Stats
content = content.replace(
  /<h3 className="font-display-lg text-display-lg font-black mt-xs">1,284<\/h3>/g,
  `<h3 className="font-display-lg text-display-lg font-black mt-xs">{userData.stats.posts}</h3>`
);
content = content.replace(
  /<h3 className="font-display-lg text-display-lg font-black mt-xs">42\.5k<\/h3>/g,
  `<h3 className="font-display-lg text-display-lg font-black mt-xs">{userData.stats.followers}</h3>`
);
content = content.replace(
  /<h3 className="font-display-lg text-display-lg font-black mt-xs">892<\/h3>/g,
  `<h3 className="font-display-lg text-display-lg font-black mt-xs">{userData.stats.following}</h3>`
);
content = content.replace(
  /<h3 className="font-display-lg text-display-lg font-black mt-xs">3<\/h3>/g,
  `<h3 className="font-display-lg text-display-lg font-black mt-xs">{userData.stats.flags}</h3>`
);

// 5. Details Section
content = content.replace(
  /<p className="font-body-md text-body-md font-semibold">Omar Al-Fayed<\/p>/g,
  `<p className="font-body-md text-body-md font-semibold">{userData.name}</p>`
);
content = content.replace(
  /<p className="font-body-md text-body-md font-semibold">omar\.alfayed@enterprise\.com<\/p>/g,
  `<p className="font-body-md text-body-md font-semibold">{userData.email}</p>`
);
content = content.replace(
  /<p className="font-body-md text-body-md font-semibold">\+1 \(555\) 012-3456<\/p>/g,
  `<p className="font-body-md text-body-md font-semibold">{userData.phone || 'Not provided'}</p>`
);
content = content.replace(
  /<p className="font-body-md text-body-md font-semibold">Dubai, United Arab Emirates<\/p>/g,
  `<p className="font-body-md text-body-md font-semibold">{userData.location || 'Unknown'}</p>`
);
content = content.replace(
  /<p className="font-body-md text-body-md font-semibold">2 hours ago \(10\.42\.1\.254\)<\/p>/g,
  `<p className="font-body-md text-body-md font-semibold">{userData.lastActive ? formatDistanceToNow(new Date(userData.lastActive), { addSuffix: true }) : 'Unknown'}</p>`
);

// 6. Security 2FA removal and Social Accounts
const securityRegex = /<div className="flex items-center justify-between">\s*<div className="flex items-center gap-md">\s*<span className="material-symbols-outlined text-green-600">verified_user<\/span>.*?<div className="h-\[1px\] bg-outline-variant"><\/div>/s;
content = content.replace(securityRegex, '');

const socialAccountsRegex = /<div className="space-y-md">.*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/s;
content = content.replace(socialAccountsRegex, `<div className="space-y-md">
                {userData.socialAccounts && userData.socialAccounts.length > 0 ? (
                  userData.socialAccounts.map((provider, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary">{provider[0].toUpperCase()}</div>
                        <span className="font-body-md text-body-md capitalize">{provider}</span>
                      </div>
                      <span className="material-symbols-outlined text-primary">check_circle</span>
                    </div>
                  ))
                ) : (
                  <p className="text-body-sm text-on-surface-variant">No linked accounts</p>
                )}
              </div>
            </div>
          </div>`);

// 7. Activity Feed Mapping
const activityFeedRegex = /<div className="p-lg space-y-lg relative">.*?<\/div>\s*<\/div>\s*\{\/\* Account Security Section \*\/\}/s;
content = content.replace(activityFeedRegex, `<div className="p-lg space-y-lg relative">
            <div className="absolute left-lg top-[3.5rem] bottom-lg w-[2px] bg-outline-variant ml-[11px]"></div>
            
            {userData.activities && userData.activities.length > 0 ? (
              userData.activities.slice(0, 5).map((activity) => {
                let icon = 'history';
                let color = 'bg-surface-container-highest text-primary ring-2 ring-surface';
                if (activity.action_type === 'POST_CREATED') { icon = 'photo'; color = 'bg-primary text-white ring-0'; }
                if (activity.action_type === 'PROFILE_UPDATED') { icon = 'person'; }
                return (
                  <div key={activity.id} className="flex gap-md relative">
                    <div className={\`w-6 h-6 rounded-full flex items-center justify-center z-10 mt-1 \${color}\`}>
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    </div>
                    <div>
                      <p className="font-body-md text-body-md"><span className="font-bold">{userData.name}</span> performed action: <span className="text-primary">{activity.action_type}</span>.</p>
                      <p className="text-xs text-on-surface-variant mt-1">{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-body-sm text-on-surface-variant pl-8">No recent activity.</p>
            )}
          </div>
        </div>

        {/* Account Security Section */}`);

// Write back
fs.writeFileSync(path, content, 'utf8');
