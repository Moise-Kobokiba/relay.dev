export const projects = [
 { name:'company-dashboard', repo:'github.com/acme/company-dashboard', target:'.env.local', members:4, activity:'12 minutes ago', status:'Connected', vars:8 },
 { name:'api-platform', repo:'github.com/acme/api-platform', target:'.env.local', members:3, activity:'Yesterday', status:'Connected', vars:5 },
 { name:'mobile-app', repo:'github.com/acme/mobile-app', target:'.env.development', members:4, activity:'2 days ago', status:'Connected', vars:12 },
 { name:'storefront', repo:'github.com/acme/storefront', target:'.env.local', members:2, activity:'Last week', status:'Needs attention', vars:6 },
]
export const transfers = [
 { project:'company-dashboard', sender:'Mo', recipient:'Sarah', vars:8, status:'Installed', date:'12 minutes ago' },
 { project:'api-platform', sender:'Daniel', recipient:'Mo', vars:5, status:'Pending', date:'1 hour ago' },
 { project:'mobile-app', sender:'Mo', recipient:'Daniel', vars:12, status:'Accepted', date:'Yesterday' },
 { project:'storefront', sender:'Sarah', recipient:'Alex', vars:6, status:'Declined', date:'Sep 24' },
]
export const variables = ['DATABASE_URL','STRIPE_SECRET_KEY','NEXTAUTH_SECRET','REDIS_URL','NEXT_PUBLIC_API_URL','SENTRY_DSN','API_BASE_URL','SESSION_SECRET']
export const members = [{name:'Mo',role:'Owner',devices:2,last:'Now',status:'Online'},{name:'Sarah',role:'Developer',devices:1,last:'12 min ago',status:'Online'},{name:'Daniel',role:'Developer',devices:2,last:'1 hour ago',status:'Away'},{name:'Alex',role:'Developer',devices:1,last:'Yesterday',status:'Offline'}]
export const devices = [{name:'MacBook Pro',os:'macOS',last:'Now',status:'Active',current:true},{name:'Windows PC',os:'Windows',last:'2 days ago',status:'Active',current:false}]
