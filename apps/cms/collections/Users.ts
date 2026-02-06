import type { CollectionConfig } from 'payload'
import type { Where } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: false,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'userType', 'company', 'assignedApplications'],
  },
  access: {
    create: ({ req }) => {
      return ['admin', 'manager'].includes((req.user as { userType?: string })?.userType ?? '')
    },
    read: ({ req }): boolean | Where => {
      const user = req.user as { userType?: string; company?: string | { id: string }; id?: string } | null
      if (user?.userType === 'admin') return true
      if (user?.userType === 'manager') {
        const companyId = typeof user.company === 'object' && user.company !== null ? (user.company as { id: string }).id : user.company
        if (companyId) return { company: { equals: companyId } } as Where
        return false
      }
      if (user?.id) return { id: { equals: user.id } } as Where
      return false
    },
    update: ({ req }) => {
      const user = req.user as { userType?: string; id?: string } | null
      if (user?.userType === 'admin') return true
      if (user?.id) return { id: { equals: user.id } }
      return false
    },
    delete: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      admin: {
        description: "User's first name",
      },
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      admin: {
        description: "User's last name",
      },
    },
    {
      name: 'userType',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Client User', value: 'client-user' },
      ],
      defaultValue: 'client-user',
      admin: {
        description: "User's role in the system",
      },
      access: {
        update: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        description: 'The company this user belongs to',
      },
      access: {
        update: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
        create: ({ req }) => ['admin', 'manager'].includes((req.user as { userType?: string })?.userType ?? ''),
      },
    },
    {
      name: 'assignedApplications',
      type: 'relationship',
      relationTo: 'image-choice-assessments',
      hasMany: true,
      admin: {
        description: 'Image choice assessments (and other apps) this user can access. Only admins and managers can edit.',
      },
      access: {
        update: ({ req }) => ['admin', 'manager'].includes((req.user as { userType?: string })?.userType ?? ''),
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this user account is active',
      },
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last time user logged in',
      },
    },
  ],
  hooks: {
    // Run before validation so required fields are preserved when admin sends empty values
    beforeValidate: [
      ({ data, operation, originalDoc }) => {
        if (!data || operation !== 'update' || !originalDoc) return data
        const doc = originalDoc as { firstName?: string; lastName?: string; company?: string | { id: string } }
        // Preserve required fields when empty so validation passes
        if (data.firstName === '' || data.firstName == null) data.firstName = doc.firstName
        if (data.lastName === '' || data.lastName == null) data.lastName = doc.lastName
        const existingCompany = doc.company
        const companyId =
          typeof existingCompany === 'object' && existingCompany !== null
            ? (existingCompany as { id: string }).id
            : existingCompany
        if (data.company === '' || data.company == null || !data.company) data.company = companyId
        // Normalize company: object with id -> id string
        if (data.company != null && typeof data.company === 'object' && 'id' in data.company) {
          data.company = (data.company as { id: string }).id
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        if (!data) return data
        // Don't update password if empty (admin form often sends empty when not changing)
        if (operation === 'update' && 'password' in data && (data as { password?: string }).password === '') {
          delete (data as { password?: string }).password
        }
        // Normalize company again for DB write
        if (data.company != null && typeof data.company === 'object' && 'id' in data.company) {
          data.company = (data.company as { id: string }).id
        }
        return data
      },
    ],
    afterLogin: [
      async ({ req, user }) => {
        await req.payload.update({
          collection: 'users',
          id: user.id,
          data: { lastLoginAt: new Date().toISOString() },
        })
      },
    ],
  },
  timestamps: true,
}
