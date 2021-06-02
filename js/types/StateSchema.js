// Copyright 2021, University of Colorado Boulder

/**
 * IO Type for JS's built-in boolean type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import tandemNamespace from '../tandemNamespace.js';

class StateSchema {
  constructor( string, validator ) {
    this.string = string;
    this.validator = validator;
  }
}

tandemNamespace.register( 'StateSchema', StateSchema );
export default StateSchema;