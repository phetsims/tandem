// Copyright 2019-2023, University of Colorado Boulder

/**
 * A tandem for a dynamic element that stores the name of the archetype that defines its dynamic element's schema.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import Tandem, { TandemOptions } from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import optionize, { EmptySelfOptions } from '../../phet-core/js/optionize.js';

type DynamicTandemOptions = StrictOmit<TandemOptions, 'isValidTandemName'>;

class DynamicTandem extends Tandem {

  public constructor( parentTandem: Tandem, name: string, providedOptions?: DynamicTandemOptions ) {
    assert && assert( parentTandem, 'DynamicTandem must have a parentTandem' );
    const options = optionize<DynamicTandemOptions, EmptySelfOptions, TandemOptions>()( {
      isValidTandemName: ( name: string ) => Tandem.getRegexFromTerm( Tandem.BASE_DYNAMIC_TANDEM_TERM ).test( name )
    }, providedOptions );
    super( parentTandem, name, options );
  }
}

tandemNamespace.register( 'DynamicTandem', DynamicTandem );
export default DynamicTandem;