import { clsx } from 'clsx'
import PageEditorTextField from '@/components/page-editor/PageEditorTextField'

interface SectionHeadingProps {
  eyebrow?: string
  heading: string
  subheading?: string
  align?: 'left' | 'center'
  colorScheme?: 'yoga' | 'hands' | 'sound'
  light?: boolean
  editable?: {
    sectionId: string
    eyebrowField?: string
    headingField: string
    subheadingField?: string
  }
}

const eyebrowColors = {
  yoga:  'text-yoga-600',
  hands: 'text-hands-600',
  sound: 'text-sound-600',
}

export default function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = 'left',
  colorScheme = 'yoga',
  light = false,
  editable,
}: SectionHeadingProps) {
  return (
    <div className={clsx('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && (
        editable?.eyebrowField ? (
          <PageEditorTextField
            sectionId={editable.sectionId}
            field={editable.eyebrowField}
            fallback={eyebrow}
            as="p"
            multiline={false}
            label="Section eyebrow"
            className={clsx('eyebrow mb-4', eyebrowColors[colorScheme])}
          />
        ) : (
          <p className={clsx('eyebrow mb-4', eyebrowColors[colorScheme])}>
            {eyebrow}
          </p>
        )
      )}
      {editable ? (
        <PageEditorTextField
          sectionId={editable.sectionId}
          field={editable.headingField}
          fallback={heading}
          as="h2"
          multiline={false}
          label="Section heading"
          className={clsx(
            'font-heading text-display-md md:text-display-lg leading-tight mb-4 text-balance',
            light ? 'text-white' : 'text-sacred-900'
          )}
        />
      ) : (
        <h2 className={clsx(
          'font-heading text-display-md md:text-display-lg leading-tight mb-4 text-balance',
          light ? 'text-white' : 'text-sacred-900'
        )}>
          {heading}
        </h2>
      )}
      {/* Gold accent line */}
      <span className={clsx(
        'gold-line block mb-5',
        align === 'center' ? 'mx-auto w-14' : 'w-12'
      )} />
      {subheading && (
        editable?.subheadingField ? (
          <PageEditorTextField
            sectionId={editable.sectionId}
            field={editable.subheadingField}
            fallback={subheading}
            as="p"
            label="Section subheading"
            className={clsx(
              'text-base font-body font-light leading-relaxed tracking-wide',
              light ? 'text-white/60' : 'text-sacred-500'
            )}
          />
        ) : (
          <p className={clsx(
            'text-base font-body font-light leading-relaxed tracking-wide',
            light ? 'text-white/60' : 'text-sacred-500'
          )}>
            {subheading}
          </p>
        )
      )}
    </div>
  )
}
