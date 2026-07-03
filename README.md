# Cactus Gazette Module

A writing-first blog and news module for [Cactus](https://github.com/usersaynoso/cactus-foundation).

Write, schedule and publish Posts with Tags, Series, comments, reactions, view
counts, an RSS feed and a WordPress/Medium/Substack importer. Post bodies are
edited with a Puck-based, prose-focused block palette (paragraphs, pull quotes,
syntax-highlighted code, images) - not the full page-builder palette.

## Installation

Add as a git submodule to your Cactus installation:

    git submodule add https://github.com/cactus-foundation-modules/gazette modules/gazette

Then install the module from the Cactus admin panel under Modules.

## Configuration

Once installed, configure the module under Admin -> Gazette -> Settings, and
grant the `gazette.access` permission to whichever core role(s) should see the
Gazette nav entry. Gazette's own roles (Contributor / Author / Editor) are then
assigned per-user from Admin -> Gazette -> Roles by a core admin.

## License

MIT
