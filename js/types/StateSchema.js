// Copyright 2021, University of Colorado Boulder

/**
 * Class responsible for storing information about the schema of PhET-iO state. See IOType stateSchema option for usage
 * and more information.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../../phet-core/js/merge.js';
import tandemNamespace from '../tandemNamespace.js';

class StateSchema {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {

    options = merge( {
      displayString: '',
      validator: null
    }, options );

    // @public (read-only)
    this.displayString = options.displayString;
    this.validator = options.validator;
  }

  /**
   * Factory function for StateSchema instances that represent a single value of state. This is opposed to a composite
   * schema of sub-components.
   * @param displayString
   * @param validator
   * @public
   * @returns {StateSchema}
   */
  static asValue( displayString, validator ) {
    return new StateSchema( {
      validator: validator,
      displayString: displayString
    } );
  }
}

tandemNamespace.register( 'StateSchema', StateSchema );
export default StateSchema;