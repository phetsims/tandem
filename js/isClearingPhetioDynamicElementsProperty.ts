// Copyright 2023, University of Colorado Boulder

/**
 * Property that is set to true when the PhET-iO State Engine is clearing dynamic elements.
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';
import TinyProperty from '../../axon/js/TinyProperty.js';

const isClearingPhetioDynamicElementsProperty = new TinyProperty( false );

tandemNamespace.register( 'isClearingPhetioDynamicElementsProperty', isClearingPhetioDynamicElementsProperty );

export default isClearingPhetioDynamicElementsProperty;
