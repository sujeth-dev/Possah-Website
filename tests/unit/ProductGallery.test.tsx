import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProductGallery } from '@/components/pdp/ProductGallery'

vi.mock('next/image', () => ({
  default: ({ alt, src, fill, priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    void fill
    void priority
    return <img alt={alt} src={typeof src === 'string' ? src : ''} {...props} />
  },
}))

describe('ProductGallery lightbox', () => {
  const images = [
    { url: '/images/a.jpg', alt: 'Image A' },
    { url: '/images/b.jpg', alt: 'Image B' },
  ]

  async function openLightbox() {
    render(<ProductGallery images={images} productName="Test Product" />)
    // MagnifierLens replaced the old "Zoom image" button. The main gallery image
    // (second occurrence of alt="Image A" — first is the thumbnail) has click
    // forwarded through MagnifierLens to open the lightbox.
    const mainImage = screen.getAllByAltText('Image A')[1]
    fireEvent.click(mainImage)
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Image lightbox' })).not.toBeNull()
    })
  }

  it('opens the lightbox from the primary image', async () => {
    await openLightbox()

    expect(screen.queryByRole('dialog', { name: 'Image lightbox' })).not.toBeNull()
    expect(screen.queryByLabelText('Close image')).not.toBeNull()
  })

  it('closes from the close button', async () => {
    await openLightbox()

    fireEvent.click(screen.getByLabelText('Close image'))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Image lightbox' })).toBeNull()
    })
  })

  it('closes from backdrop click', async () => {
    await openLightbox()

    fireEvent.click(screen.getByRole('dialog', { name: 'Image lightbox' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Image lightbox' })).toBeNull()
    })
  })

  it('does not close when clicking inside the image content', async () => {
    await openLightbox()

    const lightboxImage = screen.getAllByAltText('Image A').at(-1)
    expect(lightboxImage).not.toBeUndefined()

    fireEvent.click(lightboxImage!)

    expect(screen.queryByRole('dialog', { name: 'Image lightbox' })).not.toBeNull()
  })

  it('closes with Escape', async () => {
    await openLightbox()

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Image lightbox' })).toBeNull()
    })
  })
})
