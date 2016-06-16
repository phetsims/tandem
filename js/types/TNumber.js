// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var assertTypeOf = require( 'PHET_IO/assertions/assertTypeOf' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var TObject = require( 'PHET_IO/types/TObject' );

  var validUnits = [
    'amperes',
    'becquerels',
    'coulombs',
    'degrees Celsius',
    'farads',
    'grams',
    'gray',
    'henrys',
    'henries',
    'hertz',
    'joules',
    'katals',
    'kelvins',
    'liters',
    'liters/second',
    'lumens',
    'lux',
    'meters',
    'moles',
    'moles/liter',
    'nanometers',
    'newtons',
    'ohms',
    'pascals',
    'percent',
    'radians',
    'seconds',
    'siemens',
    'sieverts',
    'steradians',
    'tesla',
    'unitless',
    'volts',
    'watts',
    'webers'
  ];

  function validate( units ) {
    assert && assert( validUnits.indexOf( units ) >= 0,
      units + ' is not recognized as a valid unit of measurement' );
  }

  var TNumber = function( units ) {
    assert && assert( units, 'All TNumbers should specify units' );
    validate( units );
    return phetioInherit( TObject, 'TNumber', function( instance, phetioID ) {
      TObject.call( this, instance, phetioID );
      assertTypeOf( instance, 'number' );
    }, {}, {
      units: units,
      documentation: 'Wrapper for the built-in JS number type (floating point, but also represents integers)',

      fromStateObject: function( stateObject ) {
        return stateObject;
      },

      toStateObject: function( value ) {
        return value;
      }
    } );
  };

  phetioNamespace.register( 'TNumber', TNumber );

  return TNumber;
} );
