import { puckConfig } from '@/lib/puck/config.core'

// The post body reuses core's own Video block (the one pages and product
// descriptions offer) rather than a gazette copy, under core's own component
// name, so a post's video data has the same shape as a page's and picks up
// every fix core makes to the block. Uploaded video or YouTube/Vimeo link.
//
// This file is read by the public render (bodyRscConfig), so it must not touch
// lib/puck/MediaPickerField: that file is 'use client', and a server file
// calling one of its functions gets a throwing proxy. The editor-only picker
// swap lives in GazetteVideoEditor.ts instead.
export const gazetteVideoRscFieldDef = puckConfig.components.VideoEmbed
