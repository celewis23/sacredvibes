import { Node, mergeAttributes } from '@tiptap/core'

// Stored/serialized as a plain marker div — NOT a real <video> tag. This is the contract the
// backend PDF renderer and the public "View Proposal Online" page both depend on:
//   <div data-proposal-video="1" data-src="..." data-poster="..."></div>
// A PDF can't embed playable video, so ProposalPdfRenderer turns this marker into a thumbnail
// + a "watch online" link instead. The public page upgrades it into a real <video> client-side.
// Only the *editor* (via the node view below) shows a live playable preview inline.
export const ProposalVideo = Node.create({
  name: 'proposalVideo',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('data-src'),
        renderHTML: attributes => ({ 'data-src': attributes.src }),
      },
      poster: {
        default: null,
        parseHTML: element => element.getAttribute('data-poster'),
        renderHTML: attributes => (attributes.poster ? { 'data-poster': attributes.poster } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-proposal-video]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-proposal-video': '1' })]
  },

  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement('div')
      wrapper.contentEditable = 'false'
      wrapper.style.margin = '8px 0'

      const video = document.createElement('video')
      video.controls = true
      video.src = node.attrs.src
      if (node.attrs.poster) video.poster = node.attrs.poster
      video.style.maxWidth = '100%'
      video.style.display = 'block'
      video.style.borderRadius = '8px'

      wrapper.appendChild(video)
      return { dom: wrapper }
    }
  },
})
