// Enums
LITERAL                     = 0
LITERAL_INTEGER             = 1
LITERAL_BOOLEAN             = 2
LITERAL_ID                  = 3

EXPRESSION                  = 10
PARENTHESISTED_EXPRESSION   = 11
LET_EXPRESSION              = 12
RECURSIVE_LET_EXPRESSION    = 13

FUNCTOR                     = 20
LAMBDA                      = 21
FUNCTION_APP                = 22

PLUS_FUNCTION_APP           = 30
ITER_FUNCTION_APP           = 31
PAIR_FUNCTION_APP           = 32

var BaseType = function(name, type) {
    this.name = name;
    this.type = type;
    this.children = [];
    this.start_idx = -1;
    this.end_idx = -1;
};

// ----------------------------------------------------------
//                       LITERAL START

var Literal = function(literal_type) {
    BaseType.call(this, "Literal", LITERAL);
    this.literal_type = literal_type;
};

Literal.prototype = Object.create(BaseType.prototype);
Literal.prototype.constructor = BaseType;

var Integer = function(num) {
    Literal.call(this, LITERAL_INTEGER);
    this.num = num
}

var Boolean = function(bool) {
    Literal.call(this, LITERAL_BOOLEAN);
    this.bool = bool;
}

var ID = function(id) {
    Literal.call(this, LITERAL_ID);
    this.id = id;
}

Integer.prototype = Object.create(Literal.prototype);
Integer.prototype.constructor = Literal;

Boolean.prototype = Object.create(Literal.prototype);
Boolean.prototype.constructor = Literal;

ID.prototype = Object.create(Literal.prototype);
ID.prototype.constructor = Literal;

//                       LITERAL END
// ----------------------------------------------------------

// ----------------------------------------------------------
//                       EXPRESSIONS START

var Expression = function(expression_type) {
    BaseType.call(this, "Expression", EXPRESSION);
    this.expression_type = expression_type;
};

Literal.prototype = Object.create(BaseType.prototype);
Literal.prototype.constructor = BaseType;

var Parenthesised = function(paren_body) {
    Expression.call(this, PARENTHESISTED_EXPRESSION);
    this.paren_body = paren_body;
};

var Let = function(variable, def_func, body) {
    Expression.call(this, LET_EXPRESSION);
    this.variable = variable;
    this.def_func = def_func;
    this.body = body;
};

var RecursiveLet = function(variable, def_func, body) {
    Expression.call(this, RECURSIVE_LET_EXPRESSION);
    this.variable = variable;
    this.def_func = def_func;
    this.body = body;
};

Parenthesised.prototype = Object.create(Expression.prototype);
Parenthesised.prototype.constructor = Expression;

Let.prototype = Object.create(Expression.prototype);
Let.prototype.constructor = Expression;

RecursiveLet.prototype = Object.create(Expression.prototype);
RecursiveLet.prototype.constructor = Expression;

//                       EXPRESSIONS END
// ----------------------------------------------------------

// ----------------------------------------------------------
//                       FUNCTIONS START

var Functor = function(function_type) {
    BaseType.call(this, "Functor", FUNCTOR);
    this.function_type = function_type;
};

Functor.prototype = Object.create(BaseType.prototype);
Functor.prototype.constructor = BaseType;

var Lambda = function(variable, body) {
    Functor.call(this, LAMBDA);
    this.variable = variable;
    this.body = body;
};

var FunctionApp = function(func, arg) {
    Functor.call(this, FUNCTION_APP);
    this.func = func;
    this.arg = arg;
};

var Pair = function(t1, t2) {
    Functor.call(this, PAIR_FUNCTION_APP);
    this.t1 = t1;
    this.t2 = t2;
}

var Plus = function(t1, t2) {
    Functor.call(this, PLUS_FUNCTION_APP);
    this.t1 = t1;
    this.t2 = t2;
}

var Iter = function(b1, t2, t3) {
    Functor.call(this, ITER_FUNCTION_APP);
    this.b1 = b1;
    this.t2 = t2;
    this.t3 = t3;
}

Lambda.prototype = Object.create(Functor.prototype);
Lambda.prototype.constructor = Functor;

FunctionApp.prototype = Object.create(Functor.prototype);
FunctionApp.prototype.constructor = Functor;

Pair.prototype = Object.create(Functor.prototype);
Pair.prototype.constructor = Functor;

Plus.prototype = Object.create(Functor.prototype);
Plus.prototype.constructor = Functor;

Iter.prototype = Object.create(Functor.prototype);
Iter.prototype.constructor = Functor;

//                       FUNCTIONS END
// ----------------------------------------------------------
