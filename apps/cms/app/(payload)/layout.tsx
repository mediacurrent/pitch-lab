/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'

// Type assertion so the build doesn't need to reference @payloadcms/richtext-lexical internals
const typedImportMap = importMap as Record<string, React.ComponentType<unknown>>

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap: typedImportMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={typedImportMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
