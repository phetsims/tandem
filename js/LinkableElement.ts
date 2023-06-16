// Copyright 2023, University of Colorado Boulder
import PhetioObject from './PhetioObject.js';
import Tandem from './Tandem.js';

/**
 * When linking a PhET-iO Element via PhetioObject.addLinkedElement it uses this type.
 * @see PhetioObject.addLinkedElement
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
// eslint-disable-next-line phet-io-object-options-should-not-pick-from-phet-io-object
type LinkableElement = Pick<PhetioObject, 'phetioFeatured' | 'isPhetioInstrumented'> & { tandem?: Tandem };
export default LinkableElement;