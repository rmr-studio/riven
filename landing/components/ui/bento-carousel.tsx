'use client';

import {
  BentoCard,
  BentoCarouselContainer,
  BentoSlide,
} from '@/components/ui/bento-carousel-container';
import { FC, Fragment, ReactNode } from 'react';
export { BentoCard };

interface BentoLayout {
  areas: string;
  cols: string;
  rows: string;
}

export interface Slide {
  layout: BentoLayout;
  lg?: BentoLayout;
  cards: ReactNode[];
}

interface Props {
  slides: Slide[];
}

export const BentoCarousel: FC<Props> = ({ slides }) => {
  const cards = slides.flatMap((slide) => slide.cards);

  return (
    <BentoCarouselContainer mobileCards={cards} inset="10dvw">
      {slides.map((slide, index) => {
        const { areas, cols, rows } = slide.layout;
        return (
          <BentoSlide
            key={`slide-${index}`}
            gridAreas={areas}
            gridCols={cols}
            gridRows={rows}
            lg={slide.lg}
          >
            {slide.cards.map((card, cardIndex) => (
              <Fragment key={`slide-${index}-card-${cardIndex}`}>{card}</Fragment>
            ))}
          </BentoSlide>
        );
      })}
    </BentoCarouselContainer>
  );
};
