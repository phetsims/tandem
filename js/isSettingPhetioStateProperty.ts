// Copyright 2023-2024, University of Colorado Boulder

/**
 * Property that is set to true when the PhET-iO State Engine is setting the state of a simulation.
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';
import TinyProperty from '../../axon/js/TinyProperty.js';

const isSettingPhetioStateProperty = new TinyProperty( false );

tandemNamespace.register( 'isSettingPhetioStateProperty', isSettingPhetioStateProperty );

export default isSettingPhetioStateProperty;