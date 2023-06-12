// Copyright 2023, University of Colorado Boulder

/**
 * Property that controls the selection view of PhET-iO elements, predominately in Studio.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../axon/js/Property.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import StringIO from './types/StringIO.js';

export const PhetioElementsViewValues = [
  'view',
  'linked',
  'none'
] as const;

export type PhetioElementsView = ( typeof PhetioElementsViewValues )[number];

const phetioElementSelectionProperty = new Property<PhetioElementsView>( 'none', {
  tandem: Tandem.GENERAL_VIEW.createTandem( 'phetioElementSelectionProperty' ),
  phetioValueType: StringIO,
  validValues: PhetioElementsViewValues,
  phetioState: false,
  phetioDocumentation: 'Specifies how PhET-iO Elements are being selected. "view": the target view element, ' +
                       '"linked": the corresponding linked element of the view element (if there is one), "none": no active selection.'
} );

tandemNamespace.register( 'phetioElementSelectionProperty', phetioElementSelectionProperty );

export default phetioElementSelectionProperty;
