% General solution to extracting data from table.
% Problem: Given an xpath to a table in a web document, write
% a program to extract all of the data without knowing the number
% of rows (or columns) in advance.
%
% Solution: the Xpath library allows us to query the Last element of a
% structure:
%
%  ie. //foo/bar/baz/table/tr(last)/td(text).
%
%  An increment state variable is needed that is inserted into where
%  "last" is in the above xpath, at start, the predicate captures the
%  value of the last row, compares the current row to it.  If they are
%  equal, the predicate terminates. If not, the state variable is
%  incremented by 1 and the next row is returned.

:- discontiguous get_local_file/1.
:- include('scraper.pl').

% remove after testing.
get_local_file('test_input/icas.html').


% Read table into memory starting with last row; the tr(index(last))
% arguments will jump to the last element without needing to know a
% specific value.
%
% This gets pretty close to what I need:
% collect_rows(Xpath, row_cell, Row) :-
%   doc(X), xpath(X, //(div)/table/tbody, TR),
%      findall(Row, xpath(TR, tr(N0)/td(text), Row), Row),
%      Row = [Rank,Symbol,Name,BTC_Val,USD_Val,Vol_24_hr | Rest],
%      assertz(row(Rank,Symbol,Name,BTC_Val,USD_Val,Vol_24_hr)),
%      N1 = N0 + 1,
%      collect_rows(TR, tr(N1)/td(text), Next_row).
%
% Need clause for termination.

%Not complete
collect_rows(DOM, Xpath, N, Col_Start, Col_End, Results) :-
    N0 = 1,
    Xpath =.. [A,B,C],
    compound_name_arguments(E, //, [C]).

/*
%Have user enter correct Xpath before table row
% review compound_name_arguments, compound_name_arity.
% http://www.swi-prolog.org/pldoc/man?section=manipterm
% Some Experiments
% /(div)/table/tbody/tr(last)/td(text) =.. List,
|    [A,B,C] = List,
|    B =.. New_List.
List = [/, /(div)/table/tbody/tr(last), td(text)],
A =  (/),
B = /(div)/table/tbody/tr(last),
C = td(text),
New_List = [/, /(div)/table/tbody, tr(last)].

Going to need a split Xpath procedure as well as reassemble using
compound_name_arity(?Compound, ?Name, ?Arity)
compound_name_arguments(?Compound, ?Name, ?Arguments)

Xpaths are compounds that can be broken up into 3 element lists, with
the longest compound term as the second element.  Recursive splitting
until the last element is tr will permit the appending of arguments like
Last or N via term construction.

*/








