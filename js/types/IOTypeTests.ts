// Copyright 2021-2026, University of Colorado Boulder

/**
 * Unit tests for IOType
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import BooleanIO from './BooleanIO.js';
import IOType from './IOType.js';
import NumberIO from './NumberIO.js';
import SchemaOrientedIOType from './SchemaOrientedIOType.js';
import StateSchema, { CoreRecord, StateObject } from './StateSchema.js';
import StringIO from './StringIO.js';

QUnit.module( 'IOType' );

QUnit.test( 'always true', assert => {
  assert.ok( true, 'initial test' );
} );
QUnit.test( 'default toStateObject and applyState', assert => {

  class MyClass {
    public firstField = true;
    public secondField = 5;
    public willBePrivateInStateObject = 42;
    private _myUnsettableField = 'unacceptable!';
    private _secretName = 'Larry';
    private _secretNameButPublicState = 'Larry2';
    private _valueForGetterAndSetter = 'hi';

    public get gettersAndSettersTest() { return this._valueForGetterAndSetter; }

    public set gettersAndSettersTest( value: string ) { this._valueForGetterAndSetter = value; }

    public static MyClassIO = new IOType<IntentionalAny, IntentionalAny>( 'MyClassIO', {
      valueType: MyClass,
      stateSchema: {
        firstField: BooleanIO,
        secondField: NumberIO,
        _willBePrivateInStateObject: NumberIO,
        myUnsettableField: StringIO,
        gettersAndSettersTest: StringIO,
        _secretName: StringIO,
        secretNameButPublicState: StringIO
      }
    } );
  }

  const x = new MyClass();
  const stateObject = MyClass.MyClassIO.toStateObject( x );
  assert.ok( stateObject.firstField === true, 'stateObject firstField' );
  assert.ok( stateObject.secondField === 5, 'stateObject secondField' );
  assert.ok( stateObject._willBePrivateInStateObject === 42, 'stateObject willBePrivateInStateObject' );
  assert.ok( stateObject.myUnsettableField === 'unacceptable!', 'stateObject myUnsettableField' );
  assert.ok( stateObject.gettersAndSettersTest === 'hi', 'stateObject gettersAndSettersTest' );
  assert.ok( stateObject._secretName === 'Larry', 'stateObject underscore key + underscore core' );
  assert.ok( stateObject.secretNameButPublicState === 'Larry2', 'stateObject nonunderscored key + underscore core' );

  const myStateObject = {
    firstField: false,
    secondField: 2,
    _willBePrivateInStateObject: 100,
    myUnsettableField: 'other',
    gettersAndSettersTest: 'other2',
    _secretName: 'Bob',
    secretNameButPublicState: 'Bob2'
  };

  MyClass.MyClassIO.applyState( x, myStateObject );
  assert.equal( x.firstField, false, 'applyState firstField' );
  assert.ok( x.secondField === 2, 'applyState secondField' );
  assert.ok( x.willBePrivateInStateObject === 100, 'applyState willBePrivateInStateObject' );
  assert.ok( x[ '_myUnsettableField' ] === 'other', 'applyState myUnsettableField' );
  assert.ok( x.gettersAndSettersTest === 'other2', 'applyState gettersAndSettersTest' );
  assert.ok( x[ '_secretName' ] === 'Bob', 'applyState underscore key + underscore core' );
  assert.ok( !x.hasOwnProperty( 'secretName' ), 'do not write a bad field secretName' );
  assert.ok( x[ '_secretNameButPublicState' ] === 'Bob2', 'applyState nonunderscore key + underscore core' );
  assert.ok( !x.hasOwnProperty( 'secretNameButPublicState' ), 'do not write a bad field secretNameButPublicState' );
} );

QUnit.test( 'recordFromStateObject', assert => {

  const stateSchema = {
    firstField: BooleanIO,
    secondField: NumberIO,
    name: StringIO
  };

  type MyStateObject = StateObject<typeof stateSchema>;

  const coreRecord = StateSchema.recordFromStateObject( stateSchema, {
    firstField: true,
    secondField: 7,
    name: 'Ada'
  } );

  assert.equal( coreRecord.firstField, true, 'boolean field deserialized' );
  assert.equal( coreRecord.secondField, 7, 'number field deserialized' );
  assert.equal( coreRecord.name, 'Ada', 'string field deserialized' );

  const stateObject: MyStateObject = {
    firstField: coreRecord.firstField,
    secondField: coreRecord.secondField,
    name: coreRecord.name
  };
  assert.deepEqual( stateObject, { firstField: true, secondField: 7, name: 'Ada' }, 'StateObject type is derived from the same schema' );
  assert.deepEqual(
    StateSchema.recordToStateObject( stateSchema, coreRecord ),
    stateObject,
    'recordToStateObject serializes through the same schema'
  );
} );

QUnit.test( 'SchemaOrientedIOType', assert => {

  const stateSchema = {
    firstField: BooleanIO,
    secondField: NumberIO,
    name: StringIO
  };

  type MyData = CoreRecord<typeof stateSchema>;

  const RecordIO = new SchemaOrientedIOType<MyData, typeof stateSchema>( 'RecordIO', {
    stateSchema: stateSchema
  } );

  const record = {
    firstField: true,
    secondField: 7,
    name: 'Ada'
  };

  assert.deepEqual(
    RecordIO.toStateObject( record ),
    { firstField: true, secondField: 7, name: 'Ada' },
    'record-backed values serialize through the schema'
  );

  assert.deepEqual(
    RecordIO.fromStateObject( {
      firstField: false,
      secondField: 8,
      name: 'Grace'
    } ),
    { firstField: false, secondField: 8, name: 'Grace' },
    'record-backed values deserialize through the schema'
  );
} );
