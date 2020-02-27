// Copyright 2019-2020, University of Colorado Boulder

/**
 * ReferenceIO uses reference identity for toStateObject/fromStateObject
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import validate from '../../../axon/js/validate.js';
import CouldNotYetDeserializeError from '../CouldNotYetDeserializeError.js';
import tandemNamespace from '../tandemNamespace.js';
import ObjectIO from './ObjectIO.js';

class ReferenceIO extends ObjectIO {

  /**
   * Return the json that ReferenceIO is wrapping.  This can be overridden by subclasses, or types can use ReferenceIO type
   * directly to use this implementation.
   * @param {PhetioObject} phetioObject
   * @returns {string} - the phetioID
   * @public
   */
  static toStateObject( phetioObject ) {
    validate( phetioObject, this.validator );
    return phetioObject.tandem.phetioID;
  }

  /**
   * Decodes the object from a state, used in PhetioStateEngine.setState.  This can be overridden by subclasses, or types can
   * use ReferenceIO type directly to use this implementation.
   * @param {string} referencePhetioID
   * @returns {PhetioObject}
   * @throws CouldNotYetDeserializeError
   * @public
   */
  static fromStateObject( referencePhetioID ) {
    assert && assert( typeof referencePhetioID === 'string' );
    if ( phet.phetIo.phetioEngine.hasPhetioObject( referencePhetioID ) ) {
      const phetioObject = phet.phetIo.phetioEngine.getPhetioObject( referencePhetioID );
      validate( phetioObject, this.validator );
      return phetioObject;
    }
    else {
      throw new CouldNotYetDeserializeError();
    }
  }
}

/**
 * A validator object to be used to validate the core types that IOTypes wrap.
 * @type {ValidatorDef}
 * @public
 * @override
 */
ReferenceIO.validator = ObjectIO.validator;

/**
 * Documentation that appears in PhET-iO Studio, supports HTML markup.
 * @public
 */
ReferenceIO.documentation = 'Uses reference identity for toStateObject/fromStateObject';
ReferenceIO.typeName = 'ReferenceIO';
ObjectIO.validateSubtype( ReferenceIO );

tandemNamespace.register( 'ReferenceIO', ReferenceIO );
export default ReferenceIO;