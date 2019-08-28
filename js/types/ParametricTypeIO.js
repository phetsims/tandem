// Copyright 2019, University of Colorado Boulder

/**
 * Parent IO type creator for all parametric TypeIOs. This type should not be instantiated itself, but instead used as a
 * parent to TypeIOs that require parameters.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const phetioInherit = require( 'TANDEM/phetioInherit' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const validate = require( 'AXON/validate' );

  const getDefaultParametricTypeNameSuffix = ( parameterTypes ) => `.<${parameterTypes.map( param => param.typeName ).join( ', ' )}>`;

  /**
   * @param {function(*):function(new:ObjectIO)} outerTypeIO // TODO: remove me if I'm not needed in the cache https://github.com/phetsims/tandem/issues/100
   * @param {string} outerTypeName - name of the outer type
   * @param {Array.<function(new:ObjectIO)>} parameterTypes
   * @param options
   */
  const ParametricTypeIO = ( outerTypeIO, outerTypeName, parameterTypes, options ) => {

    options = _.extend( {
      typeName: null // {null|string} - if provided, this will be the typeName for the subtype of ParametricTypeImplIO.
    }, options );

    validate( parameterTypes, { valueType: Array } );
    validate( options.typeName, { valueType: [ 'string', null ] } );

    const parametricTypeNameSuffix = '.<' + parameterTypes.map( param => param.typeName ).join( ', ' ) + '>';

    if ( options.typeName === null ) {
      options.typeName = outerTypeName + parametricTypeNameSuffix;
    }

    // TODO: make sure each parameter type is an IO type (see phetioInherit's isIOType) https://github.com/phetsims/tandem/issues/100

    /**
     * @param {PhetioObject} instance
     * @param {string} phetioID
     * @constructor
     */
    function ParametricTypeImplIO( instance, phetioID ) {
      assert && assert( instance, 'instance should exist' );

      ObjectIO.call( this, instance, phetioID );
    }

    return phetioInherit( ObjectIO, `ParametricTypeImplIO${getDefaultParametricTypeNameSuffix( parameterTypes )}`, ParametricTypeImplIO, {}, {

      documentation: 'A Type that has parameters',

      /**
       * A list of parameters that define this unique TypeIO
       * @type {Array.<function(new:ObjectIO)>}
       * @public
       */
      parameterTypes: parameterTypes,

      // ParametricTypeImplIO is only a parent type, and so this shouldn't be used for validation anyways
      validator: { isValidValue: _.stubTrue },

      /**
       * The typeName of the subtype. Use this to inherit the correct typeName for the subtype.
       * @public
       * @type {string}
       */
      subtypeTypeName: options.typeName,

      /**
       *
       * TODO: are equals functions even needed if we can guarantee that the cache is unique? https://github.com/phetsims/tandem/issues/100
       * @override
       * @param {function(new:ObjectIO)} OtherParametricTypeIO
       * @returns {boolean}
       */
      equals( OtherParametricTypeIO ) {
        if ( this.typeName !== OtherParametricTypeIO.typeName ) {
          return false;
        }
        if ( this.parameterTypes.length !== OtherParametricTypeIO.parameterTypes.length ) {
          return false;
        }
        for ( let i = 0; i < this.parameterTypes.length; i++ ) {
          const thisParameterType = this.parameterTypes[ i ];
          const otherParameterType = OtherParametricTypeIO.parameterTypes[ i ];

          // TODO: is having the reciprocal here overkill?  https://github.com/phetsims/phet-io/issues/1534
          if ( !thisParameterType.equals( otherParameterType ) || !otherParameterType.equals( thisParameterType ) ) {
            return false;
          }
        }
        return this.supertype.equals( OtherParametricTypeIO.supertype ) && OtherParametricTypeIO.supertype.equals( this.supertype );
      }
    } );
  };

  /**
   * Use this to get the default parametric typeName.
   * @public
   * @param {string} outerTypeName
   * @param {Array.<function(new:ObjectIO)>} parameterTypes
   * @returns {string}
   */
  ParametricTypeIO.getDefaultParametricTypeName = ( outerTypeName, parameterTypes ) => {
    return `${outerTypeName}${getDefaultParametricTypeNameSuffix( parameterTypes )}`;
  };

  return tandemNamespace.register( 'ParametricTypeIO', ParametricTypeIO );
} );