// Copyright 2019-2020, University of Colorado Boulder

/**
 * Enumeration of the equation types.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationIO from '../../phet-core/js/EnumerationIO.js';
import tandemNamespace from './tandemNamespace.js';

const EventType = Enumeration.byKeys( [ 'USER', 'MODEL', 'WRAPPER' ], {
  beforeFreeze: EventType => {
    EventType.phetioType = EnumerationIO( EventType );
  }
} );

tandemNamespace.register( 'EventType', EventType );
export default EventType;