module.exports = {

  rules: {
    // __set__ and __get__ are used in the rewire package
    'no-underscore-dangle': ['error', { allow: ['__set__', '__get__'] }],

    // lab expects assignments to be made to the flags parameter.
    'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['flags'] }]
  }
};
